<?php

namespace App\Http\Controllers;

use App\Http\Requests\WineScanRequest;
use App\Services\LabelImageService;
use App\Services\OpenAiService;
use Illuminate\Http\JsonResponse;

class WineScanController extends Controller
{
    public function __invoke(WineScanRequest $request, LabelImageService $images, OpenAiService $ai): JsonResponse
    {
        return response()->json($ai->scan($images->encode($request->file('label'))));
    }
}
