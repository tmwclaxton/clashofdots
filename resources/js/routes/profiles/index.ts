import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
export const show = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/profiles/{profile}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
show.url = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { profile: args };
    }

    if (
        typeof args === 'object' &&
        !Array.isArray(args) &&
        'profile_uuid' in args
    ) {
        args = { profile: args.profile_uuid };
    }

    if (Array.isArray(args)) {
        args = {
            profile: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        profile:
            typeof args.profile === 'object'
                ? args.profile.profile_uuid
                : args.profile,
    };

    return (
        show.definition.url
            .replace('{profile}', parsedArgs.profile.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
show.get = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
show.head = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
const showForm = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
showForm.get = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ProfileController::show
 * @see app/Http/Controllers/ProfileController.php:47
 * @route '/profiles/{profile}'
 */
showForm.head = (
    args:
        | { profile: string | { profile_uuid: string } }
        | [profile: string | { profile_uuid: string }]
        | string
        | { profile_uuid: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;

const profiles = {
    show: Object.assign(show, show),
};

export default profiles;
