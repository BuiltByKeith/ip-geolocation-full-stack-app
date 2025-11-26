<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ip_address',
        'geo_data',
    ];

    protected $casts = [
        'geo_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}