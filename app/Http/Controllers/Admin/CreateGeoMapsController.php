<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Maps\GeoMapGenerator;
use App\Models\Map;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CreateGeoMapsController extends Controller
{
    public function __invoke(Request $request, GeoMapGenerator $generator): RedirectResponse
    {
        $admin = $request->user();
        $created = [];
        $skipped = [];

        foreach (GeoMapGenerator::TYPES as $type => $label) {
            $exists = Map::query()
                ->where('is_geo_map', true)
                ->where('name', $label)
                ->where('published', true)
                ->exists();

            if ($exists) {
                $skipped[] = $label;

                continue;
            }

            $data = $generator->generate($type);

            Map::create([
                'user_id' => $admin->id,
                'name' => $label,
                'data' => $data,
                'published' => true,
                'published_at' => now(),
                'is_geo_map' => true,
            ]);

            $created[] = $label;
        }

        if (empty($created)) {
            return back()->with('info', 'All geo maps already exist — nothing to do.');
        }

        $createdList = implode(', ', $created);
        $message = "Geo maps created: {$createdList}.";

        if (! empty($skipped)) {
            $skippedList = implode(', ', $skipped);
            $message .= " Skipped (already exist): {$skippedList}.";
        }

        return back()->with('success', $message);
    }
}
