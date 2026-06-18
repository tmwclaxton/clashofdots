import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
 * @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
 * @route '/admin/seed-fake-data'
 */
const SeedFakeDataController = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: SeedFakeDataController.url(options),
    method: 'post',
});

SeedFakeDataController.definition = {
    methods: ['post'],
    url: '/admin/seed-fake-data',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
 * @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
 * @route '/admin/seed-fake-data'
 */
SeedFakeDataController.url = (options?: RouteQueryOptions) => {
    return SeedFakeDataController.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
 * @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
 * @route '/admin/seed-fake-data'
 */
SeedFakeDataController.post = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: SeedFakeDataController.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
 * @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
 * @route '/admin/seed-fake-data'
 */
const SeedFakeDataControllerForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: SeedFakeDataController.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
 * @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
 * @route '/admin/seed-fake-data'
 */
SeedFakeDataControllerForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: SeedFakeDataController.url(options),
    method: 'post',
});

SeedFakeDataController.form = SeedFakeDataControllerForm;

export default SeedFakeDataController;
