<?php

namespace App\Enums;

enum BottleStatus: string
{
    case Available = 'available';
    case Consumed = 'consumed';
    case Removed = 'removed';
}
