import alienrpgActorSheet from "/systems/alienrpg/module/actor/actor-sheet.js";
import { yze } from "/systems/alienrpg/module/YZEDiceRoller.js";
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
    // Patch Item rolling
    libWrapper.register(moduleName, "CONFIG.Item.documentClass.prototype.roll", starWarsRoll, "MIXED");
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

    // For talent items, replace career select options with text input
    if (itemData.type === "talent") {
        html.find(`select[name="data.general.career.value"]`).remove();
        html.find(`div.wItem3`).append(`<input type="text" class="textbox" name="data.general.career.value" value="${itemData.data.general.career.value}" rows="1" data-dtype="String" style="width: 87%">`);
        
        return;
    }

    // Add Attribute select to weapon items
    if (itemData.type === "weapon") {
        html.find(`div.resources.grid-weapon`).css("grid-template-areas", '"wItem1 wItem2 wItem3 wItem4" "wItem5 wItem6 wItem7 wItem8"');
        html.find(`h3.wItem6`).removeClass("wItem6").addClass("wItem5");
        html.find(`div.selectBox.wItem7`).removeClass("wItem7").addClass("wItem6");

        const attributes = {
            str: "Strength",
            agl: "Agility",
            wit: "Wits",
            emp: "Emapthy"
        };
        const options = {
            hash: {
                selected: itemData.data.attributes.attribute?.value || "str"
            }
        };
        const attributeOptions = Handlebars.helpers.selectOptions.call(this, attributes, options);
        const snippet = `
            <h3 class="wItem7 resource-label">Attribute</h3>
            <div class="selectBox wItem8">
                <select class="select-css" name="data.attributes.attribute.value">
                    ${attributeOptions}
                </select>
            </div>
        `;
        
        html.find(`div.resources.grid-weapon`).append(snippet);
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

async function starWarsRoll(wrapped, right) {
    try {
        await wrapped(right);
    } catch (err) {
        if (this.type !== "weapon") return;

        // Basic template rendering data
        const item = this.data;
        if (item.type === 'armor') {
            return;
        }
        const actorData = this.actor ? this.actor.data.data : {};
        const actorid = this.actor.id;
        const itemData = item.data;
        const itemid = item._id;
        game.alienrpg.rollArr.sCount = 0;
        game.alienrpg.rollArr.multiPush = 0;

        let r2Data = 0;
        let reRoll = false;
        if (this.actor.data.type === 'character') {
            r2Data = this.actor.getRollData().stress;
            reRoll = false;
        } else {
            r2Data = 0;
            reRoll = true;
        }
        let label = `${item.name} (` + game.i18n.localize('ALIENRPG.Damage') + ` : ${item.data.attributes.damage.value})`;
        let hostile = this.actor.data.type;
        let blind = false;

        if (this.actor.data.token.disposition === -1) {
            blind = true;
        }

        const r1Data = actorData.attributes[itemData.attributes.attribute.value].mod + itemData.attributes.bonus.value;
        if (item.data.header.type.value === '1') {
            yze.yzeRoll(hostile, blind, reRoll, label, r1Data, game.i18n.localize('ALIENRPG.Black'), r2Data, game.i18n.localize('ALIENRPG.Yellow'), actorid, itemid);
            game.alienrpg.rollArr.sCount = game.alienrpg.rollArr.r1Six + game.alienrpg.rollArr.r2Six;
        } else if (item.data.header.type.value === '2') {
            yze.yzeRoll(hostile, blind, reRoll, label, r1Data, game.i18n.localize('ALIENRPG.Black'), r2Data, game.i18n.localize('ALIENRPG.Yellow'), actorid, itemid);
            game.alienrpg.rollArr.sCount = game.alienrpg.rollArr.r1Six + game.alienrpg.rollArr.r2Six;
        } else {
            console.warn('No type on item');
        }
    }
}
