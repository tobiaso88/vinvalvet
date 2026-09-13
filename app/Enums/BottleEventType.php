<?php

namespace App\Enums;

enum BottleEventType: string
{
    case Created = 'created';
    case Placed = 'placed';
    case Moved = 'moved';
    case Consumed = 'consumed';
    case Removed = 'removed';
}
