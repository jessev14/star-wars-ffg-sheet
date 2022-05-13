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

    async getData(options) {
        const data = await super.getData(options);

        data.species = {none: ""};
        const table = game.tables.find(t => t.name === "Playable Species");
        table?.results.contents.forEach(r => {
            const val = r.data.text;
            data.species[val] = val;
        });

        data.storyPointsReplacement = game.settings.get(moduleName, "storyPointsText");
        data.radiationReplacement = game.settings.get(moduleName, "radiationText");

        data.data.skills = Object.entries(data.data.skills)
            .sort((a, b) => {
                return a[1].label > b[1].label ? 1 : -1;
            })
            .map(([k, v]) => {
            return {...v, key: k}
        });

        return data;
    }
}