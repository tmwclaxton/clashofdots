import OverviewController from './OverviewController'
import SeedFakeDataController from './SeedFakeDataController'
import CreateGeoMapsController from './CreateGeoMapsController'

const Admin = {
    OverviewController: Object.assign(OverviewController, OverviewController),
    SeedFakeDataController: Object.assign(SeedFakeDataController, SeedFakeDataController),
    CreateGeoMapsController: Object.assign(CreateGeoMapsController, CreateGeoMapsController),
}

export default Admin