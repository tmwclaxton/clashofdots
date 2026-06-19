import Maps from './Maps'
import ProfileController from './ProfileController'
import Admin from './Admin'
import QuickStartController from './QuickStartController'
import Games from './Games'
import MatchmakingController from './MatchmakingController'
import Settings from './Settings'

const Controllers = {
    Maps: Object.assign(Maps, Maps),
    ProfileController: Object.assign(ProfileController, ProfileController),
    Admin: Object.assign(Admin, Admin),
    QuickStartController: Object.assign(QuickStartController, QuickStartController),
    Games: Object.assign(Games, Games),
    MatchmakingController: Object.assign(MatchmakingController, MatchmakingController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers