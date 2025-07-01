<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LPController;
use Illuminate\Http\Request;

Route::view('/', 'lp_formulario');
Route::post('/resolver-lp', [LPController::class, 'resolverLP']);

Route::post('/language-switch', function (Request $request) {
    $locale = $request->input('locale');
    if (in_array($locale, ['en', 'es'])) {
        session(['locale' => $locale]);
    }
    return back();
})->name('language.switch');
