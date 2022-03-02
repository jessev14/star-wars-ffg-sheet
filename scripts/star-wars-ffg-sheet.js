import alienrpgActorSheet from "/systems/alienrpg/module/actor/actor-sheet.js";
import { StarWarsActorSheet } from "./StarWarsActorSheet.js";

export const moduleName = "star-wars-ffg-sheet";

const swSkills = {
    ast: {
        label: "Astrogation",
        ability: "wit"
    },
    ath: {
        label: "Athletics",
        ability: "str"
    },
    att: {
        label: "Attunement",
        ability: "emp"
    },
    com: {
        label: "ComTech",
        ability: "wit"
    },
    dec: {
        label: "Deception",
        ability: "emp"
    },
    cra: {
        label: "Crafting",
        ability: "str"
    },
    dex: {
        label: "Dexterity",
        ability: "agl"
    },
    end: {
        label: "Endurance",
        ability: "str"
    },
    ins: {
        label: "Insight",
        ability: "emp"
    },
    inv: {
        label: "Investigation",
        ability: "wit"
    },
    fer: {
        label: "Ferocity",
        ability: "str"
    },
    mob: {
        label: "Mobility",
        ability: "agl"
    },
    obs: {
        label: "Observation",
        ability: "wit"
    },
    per: {
        label: "Persuasion",
        ability: "emp"
    },
    pil: {
        label: "Piloting",
        ability: "agl"
    },
    ste: {
        label: "Stealth",
        ability: "agl"
    }
};
let ogSkills;


Hooks.once("init", () => {
    // Register module settings

    // Register sheet application classes
    Actors.unregisterSheet("alienrpg", alienrpgActorSheet);
    Actors.registerSheet(moduleName, StarWarsActorSheet, {
        types: ['character'],
        makeDefault: true
    });

    // Add new skills to CONFIG
    ogSkills = duplicate(CONFIG.ALIENRPG.skills);
    for (const [skl, skill] of Object.entries(swSkills)) {
        CONFIG.ALIENRPG.skills[skl] = skill.label;
    }

    // Patch Actor data preparation
    libWrapper.register(moduleName, "CONFIG.Actor.documentClass.prototype._prepareCharacterData", _prepareStarWarsCharacterData, "WRAPPER");    
});

Hooks.once("setup", () => {
});


Hooks.on("renderalienrpgItemSheet", (sheet, html, itemData) => {
    if (itemData.type !== "skill-stunts") return;
    
    html.find(`select[name="name"]`).remove();
    const nameInput = `<input name="name" type="text" value="${itemData.name}" />`;
    html.find(`h1.charname`).append(nameInput);
});


function _prepareStarWarsCharacterData(wrapped, actorData) {
    // Add new skills
    mergeObject(actorData.data.skills, swSkills);
    for (const [skl, skill] of Object.entries(actorData.data.skills)) {
        if (!skill.value) setProperty(actorData, `data.skills.${skl}.value`, 0);
        if (!skill.description) setProperty(actorData, `data.skills.${skl}.description`, skill.label);
    }

    wrapped(actorData);

    // Max XP = 12
    setProperty(actorData, "data.general.xp.max", 12);

    // Remove original skills
    for (const skl of Object.keys(ogSkills)) {
        delete actorData.data.skills[skl];
    }
}