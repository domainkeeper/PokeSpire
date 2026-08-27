import { registerMapModule } from './mapRegistry';

// Spine maps (PHASE 4)
import coastalCity from './maps/coastal/coastalCity';
import route1CoastRoad from './maps/coastal/route1CoastRoad';
import verdantForest from './maps/heartland/verdantForest';
import oldStoneBridge from './maps/heartland/oldStoneBridge';
import duskOutskirts from './maps/dusk/duskOutskirts';
import duskDowntown from './maps/dusk/duskDowntown';

registerMapModule(coastalCity);
registerMapModule(route1CoastRoad);
registerMapModule(verdantForest);
registerMapModule(oldStoneBridge);
registerMapModule(duskOutskirts);
registerMapModule(duskDowntown);

// Coral Coast filler maps (PHASE 5)
import harborDistrict from './maps/coastal/harborDistrict';
import lighthousePoint from './maps/coastal/lighthousePoint';
import seabreezeCove from './maps/coastal/seabreezeCove';
import coastalWetlands from './maps/coastal/coastalWetlands';
import tidepoolFlats from './maps/coastal/tidepoolFlats';
import gullRockIsle from './maps/coastal/gullRockIsle';

registerMapModule(harborDistrict);
registerMapModule(lighthousePoint);
registerMapModule(seabreezeCove);
registerMapModule(coastalWetlands);
registerMapModule(tidepoolFlats);
registerMapModule(gullRockIsle);

// Heartland Wilds maps (PHASE 6)
import route2Meadowway from './maps/heartland/route2Meadowway';
import whisperwindMeadow from './maps/heartland/whisperwindMeadow';
import forestHollow from './maps/heartland/forestHollow';
import route3Riverside from './maps/heartland/route3Riverside';
import mistmereLake from './maps/heartland/mistmereLake';
import route4Foothill from './maps/heartland/route4Foothill';
import craggyHighlands from './maps/heartland/craggyHighlands';
import echoCaveEntrance from './maps/heartland/echoCaveEntrance';
import sunkenGrotto from './maps/heartland/sunkenGrotto';
import route4bSwitchback from './maps/heartland/route4bSwitchback';

registerMapModule(route2Meadowway);
registerMapModule(whisperwindMeadow);
registerMapModule(forestHollow);
registerMapModule(route3Riverside);
registerMapModule(mistmereLake);
registerMapModule(route4Foothill);
registerMapModule(craggyHighlands);
registerMapModule(echoCaveEntrance);
registerMapModule(sunkenGrotto);
registerMapModule(route4bSwitchback);

// Dusk Metro maps (PHASE 7)
import route5DuskApproach from './maps/dusk/route5DuskApproach';
import windmillFarms from './maps/dusk/windmillFarms';
import duskWestGate from './maps/dusk/duskWestGate';
import duskResidential from './maps/dusk/duskResidential';
import duskNightMarket from './maps/dusk/duskNightMarket';
import duskIndustrial from './maps/dusk/duskIndustrial';
import duskRiversidePark from './maps/dusk/duskRiversidePark';
import duskHeights from './maps/dusk/duskHeights';
import route6MetroFringe from './maps/dusk/route6MetroFringe';
import duskDepot from './maps/dusk/duskDepot';

registerMapModule(route5DuskApproach);
registerMapModule(windmillFarms);
registerMapModule(duskWestGate);
registerMapModule(duskResidential);
registerMapModule(duskNightMarket);
registerMapModule(duskIndustrial);
registerMapModule(duskRiversidePark);
registerMapModule(duskHeights);
registerMapModule(route6MetroFringe);
registerMapModule(duskDepot);
