import alienrpgActorSheet from "/systems/alienrpg/module/actor/actor-sheet.js";
import { moduleName } from "./star-wars-ffg-sheet.js";

export class StarWarsActorSheet extends alienrpgActorSheet {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes.push('star-wars');

        return options;
    }

    get template() {
        return `modules/${moduleName}/templates/starWarsActorSheetTemplate.hbs`;
    }

    getData(options) {
        const data = super.getData(options);

        data.species = {};
        const table = game.tables.find(t => t.name === "Playable Species");

        table?.results.contents.forEach(r => {
            const val = r.data.text;
            data.species[val] = val;
        });

        data.storyPointsReplacement = game.settings.get(moduleName, "storyPointsText");
        data.radiationReplacement = game.settings.get(moduleName, "radiationText");

        return data;
    }
}