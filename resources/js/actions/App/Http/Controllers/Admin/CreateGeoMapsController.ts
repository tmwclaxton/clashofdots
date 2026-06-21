import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
const CreateGeoMapsController = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: CreateGeoMapsController.url(options),
    method: 'post',
})

CreateGeoMapsController.definition = {
    methods: ["post"],
    url: '/admin/create-geo-maps',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
CreateGeoMapsController.url = (options?: RouteQueryOptions) => {
    return CreateGeoMapsController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
CreateGeoMapsController.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: CreateGeoMapsController.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
const CreateGeoMapsControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: CreateGeoMapsController.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreateGeoMapsController::__invoke
* @see app/Http/Controllers/Admin/CreateGeoMapsController.php:13
* @route '/admin/create-geo-maps'
*/
CreateGeoMapsControllerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: CreateGeoMapsController.url(options),
    method: 'post',
})

CreateGeoMapsController.form = CreateGeoMapsControllerForm

export default CreateGeoMapsController