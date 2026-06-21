import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
export const overview = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: overview.url(options),
    method: 'get',
})

overview.definition = {
    methods: ["get","head"],
    url: '/admin',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
overview.url = (options?: RouteQueryOptions) => {
    return overview.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
overview.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: overview.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
overview.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: overview.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
const overviewForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: overview.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
overviewForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: overview.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
overviewForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: overview.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

overview.form = overviewForm

/**
* @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
* @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
* @route '/admin/seed-fake-data'
*/
export const seedFakeData = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: seedFakeData.url(options),
    method: 'post',
})

seedFakeData.definition = {
    methods: ["post"],
    url: '/admin/seed-fake-data',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
* @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
* @route '/admin/seed-fake-data'
*/
seedFakeData.url = (options?: RouteQueryOptions) => {
    return seedFakeData.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
* @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
* @route '/admin/seed-fake-data'
*/
seedFakeData.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: seedFakeData.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
* @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
* @route '/admin/seed-fake-data'
*/
const seedFakeDataForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: seedFakeData.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SeedFakeDataController::__invoke
* @see app/Http/Controllers/Admin/SeedFakeDataController.php:43
* @route '/admin/seed-fake-data'
*/
seedFakeDataForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: seedFakeData.url(options),
    method: 'post',
})

seedFakeData.form = seedFakeDataForm

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
export const createGeoMaps = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createGeoMaps.url(options),
    method: 'post',
})

createGeoMaps.definition = {
    methods: ["post"],
    url: '/admin/create-geo-maps',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
createGeoMaps.url = (options?: RouteQueryOptions) => {
    return createGeoMaps.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
createGeoMaps.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createGeoMaps.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
const createGeoMapsForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createGeoMaps.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
createGeoMapsForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createGeoMaps.url(options),
    method: 'post',
})

createGeoMaps.form = createGeoMapsForm

const admin = {
    overview: Object.assign(overview, overview),
    seedFakeData: Object.assign(seedFakeData, seedFakeData),
    createGeoMaps: Object.assign(createGeoMaps, createGeoMaps),
}

export default admin