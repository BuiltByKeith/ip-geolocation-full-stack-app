<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SearchHistory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class GeoLocationController extends Controller
{
    /**
     * Get geolocation information for an IP address
     */
    public function getGeoLocation(Request $request)
    {
        $ip = $request->input('ip', '');
        
        try {
            // Build URL - empty IP gets user's own IP
            $url = $ip ? "https://ipinfo.io/{$ip}/geo" : "https://ipinfo.io/geo";
            
            // Make request to ipinfo.io
            $response = Http::timeout(10)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                
                // Save to history if IP is provided and user is authenticated
                if ($ip && $request->user()) {
                    SearchHistory::create([
                        'user_id' => $request->user()->id,
                        'ip_address' => $ip,
                        'geo_data' => $data,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'data' => $data
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch geolocation data'
            ], 400);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's search history
     */
    public function getHistory(Request $request)
    {
        try {
            $histories = SearchHistory::where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $histories
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple history records
     */
    public function deleteHistory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:search_histories,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Delete only histories belonging to the authenticated user
            $deleted = SearchHistory::whereIn('id', $request->ids)
                ->where('user_id', $request->user()->id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'History deleted successfully',
                'deleted_count' => $deleted
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting history: ' . $e->getMessage()
            ], 500);
        }
    }
}