<?php

namespace App\Enums;

enum WineType: string
{
    case Red = 'red';
    case White = 'white';
    case Rose = 'rose';
    case Sparkling = 'sparkling';
    case Dessert = 'dessert';
    case Fortified = 'fortified';
    case Orange = 'orange';
    case Other = 'other';
}
