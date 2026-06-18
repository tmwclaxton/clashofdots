<?php

namespace App\Http\Requests\Maps;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExploreMapsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'max:120'],
            'author' => ['sometimes', 'nullable', 'string', 'max:80'],
            'uuid' => ['sometimes', 'nullable', 'string', 'uuid', 'max:36'],
            'sort' => ['sometimes', 'nullable', 'string', 'max:32'],
            'per_page' => ['sometimes', 'nullable', 'integer', Rule::in([12, 24, 48])],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'teams' => ['sometimes', 'nullable', 'integer', 'min:2', 'max:8'],
        ];
    }

    /**
     * @return array{q: string, author: string, uuid: string, sort: string, per_page: int, teams: int|null}
     */
    public function exploreFilters(): array
    {
        $validated = $this->validated();
        $allowedSorts = [
            'newest',
            'oldest',
            'name_az',
            'name_za',
            'most_likes',
            'most_forks',
            'most_games',
        ];
        $sort = $validated['sort'] ?? 'newest';
        if (! is_string($sort) || ! in_array($sort, $allowedSorts, true)) {
            $sort = 'newest';
        }

        $perPage = (int) ($validated['per_page'] ?? 12);
        if (! in_array($perPage, [12, 24, 48], true)) {
            $perPage = 12;
        }

        $q = isset($validated['q']) && is_string($validated['q']) ? trim($validated['q']) : '';
        $author = isset($validated['author']) && is_string($validated['author']) ? trim($validated['author']) : '';
        $uuid = isset($validated['uuid']) && is_string($validated['uuid']) ? trim($validated['uuid']) : '';

        $teams = isset($validated['teams']) && is_numeric($validated['teams'])
            ? (int) $validated['teams']
            : null;

        return [
            'q' => $q,
            'author' => $author,
            'uuid' => $uuid,
            'sort' => $sort,
            'per_page' => $perPage,
            'teams' => $teams,
        ];
    }
}
