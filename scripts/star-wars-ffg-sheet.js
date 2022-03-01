import alienrpgActorSheet from "/systems/alienrpg/module/actor/actor-sheet.js";
import { StarWarsActorSheet } from "./StarWarsActorSheet.js";

export const moduleName = "star-wars-ffg-sheet";


Hooks.once("init", () => {
    // Register module settings

    // Register sheet application classes
    Actors.unregisterSheet("alienrpg", alienrpgActorSheet);
    Actors.registerSheet(moduleName, StarWarsActorSheet, {
        types: ['character'],
        makeDefault: true
    });

    // Patch Actor data preparation
    libWrapper.register(moduleName, "CONFIG.Actor.documentClass.prototype._prepareCharacterData", _prepareStarWarsCharacterData, "WRAPPER");

});

Hooks.once("setup", () => {
});


function _prepareStarWarsCharacterData(wrapped, actorData) {
    wrapped(actorData);

    setProperty(actorData, "data.general.xp.max", 12);
}