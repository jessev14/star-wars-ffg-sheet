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
    game.settings.register(moduleName, "storyPointsText", {
        name: "Replace Story Points Label",
        hint: "",
        scope: "world",
        config: true,
        type: String,
        default: "Force Points"
    });

    game.settings.register(moduleName, "radiationText", {
        name: "Replace Radiation Label",
        hint: "",
        scope: "world",
        config: true,
        type: String,
        default: "Radiation"
    });

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


Hooks.on("renderItemSheet", (sheet, html, itemData) => {
    // Allow skill-stunts items to be renamed to add stunts to new skills
    if (itemData.type === "skill-stunts") {
        html.find(`select[name="name"]`).remove();
        const nameInput = `<input name="name" type="text" value="${itemData.name}" />`;
        html.find(`h1.charname`).append(nameInput);

        return;
    }

    // For item, armor, critical-injury items, replace skill modifiers
    if (html.find(`div.tab.modifiers`).length) {
        const skillList = html.find(`div.tab.modifiers`).find(`div.grid-2col`).last();
        skillList.find(`div.modifiers`).remove();

        let snippet = ``;
        for (const [skl, skill] of Object.entries(swSkills)) {
            const value = itemData.data.modifiers.skills[skl]?.value || 0;
            const skillTemplate = `
                <div class="modifiers flexrow flex-group-center">
                    <label for="data.modifiers.skills.${skl}.value" class="resource-label">${skill.label} (${skill.ability})</label>
                    <input type="text" class="maxboxsize" name="data.modifiers.skills.${skl}.value" value="${value}" data-dtype="Number" />
                </div>    
            `;

            snippet += skillTemplate;
        }
        skillList.append(snippet);
    }

    // For talent items, replace career select options with custom careers
    if (itemData.type === "talent") {
        const table = game.tables.find(t => t.name === "Playable Careers");
        if (!table) return;

        const careers = {};
        table.results.contents.forEach(r => {
            const val = r.data.text;
            careers[val] = val;
        });
        const options = {
            hash: {
                selected: itemData.data.general.career.value
            }
        };
        const newCareers = Handlebars.helpers.selectOptions.call(this, careers, options);
        html.find(`select[name="data.general.career.value"]`).find(`option`).remove();
        html.find(`select[name="data.general.career.value"]`).append(newCareers.string);

        return;
    }
});


function _prepareStarWarsCharacterData(wrapped, actorData) {
    // Add new skills; Perform this before calling original function so that original function processes these skills
    mergeObject(actorData.data.skills, swSkills);
    for (const [skl, skill] of Object.entries(actorData.data.skills)) {
        if (!skill.value) setProperty(actorData, `data.skills.${skl}.value`, 0);
        if (!skill.description) setProperty(actorData, `data.skills.${skl}.description`, skill.label);
    }

    // Call original function to handle core data preparation
    wrapped(actorData);

    // Max XP = 12
    setProperty(actorData, "data.general.xp.max", 12);

    // Remove original skills
    for (const skl of Object.keys(ogSkills)) {
        delete actorData.data.skills[skl];
    }
}