<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LabelImageService
{
    public function encode(UploadedFile $file, bool $preserveAlpha = false): string
    {
        $size = getimagesize($file->getPathname());
        if (! $size || $size[0] * $size[1] > 24000000) {
            throw ValidationException::withMessages(['label' => 'Bilden är för stor. Välj ett foto under 24 megapixlar.']);
        }
        $image = imagecreatefromstring($file->getContent());
        if (! $image) {
            throw ValidationException::withMessages(['label' => 'Bilden kunde inte läsas.']);
        }
        if ($file->getMimeType() === 'image/jpeg') {
            $orientation = (@exif_read_data($file->getPathname()) ?: [])['Orientation'] ?? 1;
            if (in_array($orientation, [2, 4, 5, 7], true)) {
                imageflip($image, IMG_FLIP_HORIZONTAL);
            }
            $angle = match ($orientation) {
                3, 4 => 180, 5, 6 => -90, 7, 8 => 90, default => 0
            };
            if ($angle !== 0) {
                $image = imagerotate($image, $angle, 0);
            }
        }
        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, 2048 / max($width, $height));
        $resized = imagecreatetruecolor(max(1, (int) ($width * $scale)), max(1, (int) ($height * $scale)));
        if ($preserveAlpha) {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
        }
        imagefill($resized, 0, 0, imagecolorallocatealpha($resized, 255, 255, 255, $preserveAlpha ? 127 : 0));
        imagecopyresampled($resized, $image, 0, 0, 0, 0, imagesx($resized), imagesy($resized), $width, $height);
        ob_start();
        if ($preserveAlpha) {
            imagepng($resized);
        } else {
            imagejpeg($resized, null, 85);
        }

        return (string) ob_get_clean();
    }

    public function store(UploadedFile $file, int $userId): string
    {
        $preserveAlpha = $file->getMimeType() === 'image/png';
        if ($preserveAlpha) {
            $this->encode($file);
            $image = imagecreatefromstring($file->getContent());
            $preserveAlpha = false;
            for ($y = 0; $y < imagesy($image) && ! $preserveAlpha; $y++) {
                for ($x = 0; $x < imagesx($image); $x++) {
                    if (imagecolorsforindex($image, imagecolorat($image, $x, $y))['alpha'] > 0) {
                        $preserveAlpha = true;
                        break;
                    }
                }
            }
        }
        $path = 'labels/'.$userId.'/'.Str::uuid().($preserveAlpha ? '.png' : '.jpg');
        Storage::disk('local')->put($path, $this->encode($file, $preserveAlpha));

        return $path;
    }
}
