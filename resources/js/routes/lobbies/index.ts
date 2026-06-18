import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/lobbies',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Games\GameController::index
 * @see app/Http/Controllers/Games/GameController.php:28
 * @route '/lobbies'
 */
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

index.form = indexForm;

const lobbies = {
    index: Object.assign(index, index),
};

export default lobbies;
