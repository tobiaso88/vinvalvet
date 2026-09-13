<?php

namespace App\Services;

use App\Enums\BottleEventType;
use App\Enums\BottleStatus;
use App\Models\Bottle;
use App\Models\User;
use App\Models\Wine;
use App\Models\WineRack;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /** All inventory writes acquire the owner's row first to serialize rack resizing and bottle movement. */
    public function lockOwner(int $userId): void
    {
        User::whereKey($userId)->lockForUpdate()->firstOrFail();
    }

    public function add(Wine $wine, int $quantity, array $positions = []): void
    {
        DB::transaction(function () use ($wine, $quantity, $positions) {
            $this->lockOwner($wine->user_id);
            if (count($positions) > $quantity) {
                throw ValidationException::withMessages(['positions' => 'Välj högst en plats per flaska.']);
            }
            foreach (range(1, max(1, $quantity)) as $number) {
                if ($quantity === 0) {
                    break;
                }
                $bottle = $wine->bottles()->create(['status' => BottleStatus::Available]);
                $this->event($bottle, BottleEventType::Created, null, 'Oplacerad');
                if (isset($positions[$number - 1])) {
                    $this->place($bottle, $positions[$number - 1]);
                }
            }
        }, 3);
    }

    public function place(Bottle $bottle, array $position): void
    {
        DB::transaction(function () use ($bottle, $position) {
            $this->lockOwner($bottle->wine->user_id);
            $bottle->refresh()->load('rack', 'wine');
            $this->ensureAvailable($bottle);
            $from = $bottle->location;
            $rackId = $position['wine_rack_id'] ?? null;
            if ($rackId) {
                $rack = WineRack::where('user_id', $bottle->wine->user_id)->findOrFail($rackId);
                $row = (int) ($position['row'] ?? 0);
                $column = (int) ($position['column'] ?? 0);
                if ($row < 1 || $row > $rack->rows || $column < 1 || $column > $rack->columns) {
                    throw ValidationException::withMessages(['position' => 'Platsen finns inte i hyllan.']);
                }
                if ($rack->bottles()->where('row', $row)->where('column', $column)->whereKeyNot($bottle->id)->exists()) {
                    throw ValidationException::withMessages(['position' => 'Platsen är redan upptagen. Välj en annan plats.']);
                }
            } else {
                $row = $column = null;
            }
            if ($bottle->wine_rack_id == $rackId && $bottle->row === $row && $bottle->column === $column) {
                return;
            }
            $type = $bottle->wine_rack_id ? BottleEventType::Moved : BottleEventType::Placed;
            $bottle->update(['wine_rack_id' => $rackId, 'row' => $row, 'column' => $column]);
            $bottle->load('rack');
            $this->event($bottle, $type, $from, $bottle->location);
        }, 3);
    }

    public function finish(Bottle $bottle, BottleStatus $status): void
    {
        DB::transaction(function () use ($bottle, $status) {
            $this->lockOwner($bottle->wine->user_id);
            $bottle->refresh()->load('rack', 'wine');
            $this->ensureAvailable($bottle);
            $from = $bottle->location;
            $bottle->update(['status' => $status, 'wine_rack_id' => null, 'row' => null, 'column' => null]);
            $this->event($bottle, BottleEventType::from($status->value), $from, null);
        }, 3);
    }

    private function ensureAvailable(Bottle $bottle): void
    {
        if ($bottle->status !== BottleStatus::Available) {
            throw ValidationException::withMessages(['bottle' => 'Flaskan finns inte längre i lagret.']);
        }
    }

    private function event(Bottle $bottle, BottleEventType $type, ?string $from, ?string $to): void
    {
        $event = $bottle->events()->make(['type' => $type, 'from_location' => $from, 'to_location' => $to]);
        $event->user_id = $bottle->wine->user_id;
        $event->save();
    }
}
