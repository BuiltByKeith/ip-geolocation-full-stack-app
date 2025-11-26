<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GeoLocationController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes - require authentication
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Geolocation routes
    Route::get('/geolocation', [GeoLocationController::class, 'getGeoLocation']);
    Route::get('/history', [GeoLocationController::class, 'getHistory']);
    Route::delete('/history', [GeoLocationController::class, 'deleteHistory']);
});