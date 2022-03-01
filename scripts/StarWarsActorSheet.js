import alienrpgActorSheet from "/systems/alienrpg/module/actor/actor-sheet.js";
import { moduleName } from "./star-wars-ffg-sheet.js";

export class StarWarsActorSheet extends alienrpgActorSheet {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes.push("star-wars");

        return options;
    }

    get template() {
        return `modules/${moduleName}/templates/starWarsActorSheetTemplate.hbs`;
    }
}