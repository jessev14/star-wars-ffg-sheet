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

        for (const e of ["Playable Species", "Playable Careers"]) {
            const type = e === "Playable Species" ? "species" : "careers";
            data[type] = {};
            const table = game.tables.find(t => t.name === e);
            if (!table) continue;

            table.results.contents.forEach(r => {
                const val = r.data.text;
                data[type][val] = val;
            });
        }

        return data;
    }
}