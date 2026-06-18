import OverviewController from './OverviewController';
import SeedFakeDataController from './SeedFakeDataController';

const Admin = {
    OverviewController: Object.assign(OverviewController, OverviewController),
    SeedFakeDataController: Object.assign(
        SeedFakeDataController,
        SeedFakeDataController,
    ),
};

export default Admin;
