import alienrpgActorSheet from "/systems/alienrpg/module/actor/actor-sheet.js";
import { yze } from "/systems/alienrpg/module/YZEDiceRoller.js";
import { StarWarsActorSheet } from "./StarWarsActorSheet.js";
import { libWrapper } from "../lib/shim.js"

export const moduleName = "star-wars-ffg-sheet";

let swSkills;
let ogSkills;


Hooks.once("init", () => {
    // Register module settings
    game.settings.register(moduleName, "fantasyMode", {
        name: "Fantasy Mode",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => window.location.reload()
    });

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

    if (!game.settings.get(moduleName, "fantasyMode")) {
        swSkills = {
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
                ability: "wit"
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
            },
            att: {
                label: "Attunement",
                ability: "emp"
            },
        }
    } else {
        swSkills = {
            ath: {
                label: "Athletics",
                ability: "str"
            },
            cra: {
                label: "Crafting",
                ability: "str"
            },
            end: {
                label: "Endurance",
                ability: "str"
            },
            fer: {
                label: "Ferocity",
                ability: "str"
            },
            dex: {
                label: "Dexterity",
                ability: "agl"
            },
            mob: {
                label: "Mobility",
                ability: "agl"
            },
            prf: {
                label: "Performance",
                ability: "agl"
            },
            ste: {
                label: "Stealth",
                ability: "agl"
            },
            att: {
                label: "Attunement",
                ability: "emp"
            },
            dec: {
                label: "Deception",
                ability: "emp"
            },
            ins: {
                label: "Insight",
                ability: "emp"
            },
            per: {
                label: "Persuasion",
                ability: "emp"
            },
            inv: {
                label: "Investigation",
                ability: "wit"
            },
            lor: {
                label: "Lore",
                ability: "wit"
            },
            prc: {
                label: "Perception",
                ability: "wit"
            },
            sur: {
                label: "Survival",
                ability: "wit"
            }
        };
    };

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
    // Patch Actor panic condition to draw from custom roll table
    //libWrapper.register(moduleName, "CONFIG.Actor.documentClass.prototype.morePanic", starWarsMorePanic, "OVERRIDE");
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

    // Add Attribute and Skill selects to weapon items
    if (itemData.type === "weapon") {
        html.find(`div.resources.grid-weapon`).css("grid-template-areas", '"wItem1 wItem2 wItem3 wItem4" "wItem5 wItem6 wItem7 wItem7" "wItem8 wItem9 wItem10 wItem11"');

        
        const attributes = {
            str: "Strength",
            agl: "Agility",
            wit: "Wits",
            emp: "Emapthy"
        };
        const aOptions = {
            hash: {
                selected: itemData.data.attributes.attribute?.value || "str"
            }
        };
        const attributeOptions = Handlebars.helpers.selectOptions.call(this, attributes, aOptions);
        const attributeSelect = `
            <label class="resource-label" style="grid-area: wItem8">Attribute</label>
            <select class="select-css" name="data.attributes.attribute.value" style="grid-area: wItem9">
                ${attributeOptions}
            </select>
        `;
        html.find(`div.grid-weapon`).append(attributeSelect);

        const skills = {none: ""}
        for (const [skl, skill] of Object.entries(swSkills)) {
            skills[skl] = skill.label;
        }
        const sOptions = {
            hash: {
                selected: itemData.data.attributes.skill?.value || ""
            }
        };
        const skillOptions = Handlebars.helpers.selectOptions.call(this, skills, sOptions);
        const skillSelect = `
            <label class="resource-label" style="grid-area: wItem10">Skill</label>
            <select class="select-css" name="data.attributes.skill.value" style="grid-area: wItem11; max-width: unset; width: 86%">
                ${skillOptions}
            </select>
        `;
        html.find(`div.grid-weapon`).append(skillSelect);
    }
});


function _prepareStarWarsCharacterData(wrapped, actorData) {
    // Add new skills; Perform this before calling original function so that original function processes these skills
    mergeObject(actorData.data.skills, swSkills);
    for (const [skl, skill] of Object.entries(actorData.data.skills)) {
        if (!(skl in swSkills) && !(skl in ogSkills)) {
            delete actorData.data.skills[skl];
            continue;
        }
        if (!skill.value) setProperty(actorData, `data.skills.${skl}.value`, 0);
        if (!skill.description) setProperty(actorData, `data.skills.${skl}.description`, skill.label);
    }

    // Call original function to handle core data preparation
    wrapped(actorData);

    // Add item modifiers to new skills
    for (const [skey, iAttrib] of Object.entries(actorData.items.contents)) {
        const Attrib = iAttrib.data;
        if (!(Attrib.type === 'item' || Attrib.type === 'critical-injury' || Attrib.type === 'armor')) continue;
        if (Attrib.data.header.active !== true) continue;

        let skillBase = Attrib.data.modifiers.skills;
        for (let [skkey, sAttrib] of Object.entries(skillBase)) {
            if (!(skkey in swSkills) && !(skkey in ogSkills)) continue;
            setProperty(actorData, `data.skills.${skkey}.mod`, actorData.data.skills[skkey].mod + sAttrib.value);
        }    
    }

    // Remove original skills
    for (const skl of Object.keys(ogSkills)) {
        delete actorData.data.skills[skl];
    }

    // Change Story Point Maximum to 10
    setProperty(actorData, 'data.general.sp.max', 10);

}

function starWarsMorePanic(pCheck) {
    const table = game.tables.getName("Panic Table");
    const result = table.getResultsForRoll(pCheck)[0];
    return result?.data.text || "Panic Level not defined in Panic Table.";
}

async function starWarsRoll(wrapped, right) {
    if (right && this.type === "weapon") {
        Hooks.once("renderDialog", (app, html, data) => {
            console.log(app);
            app.data.close = () => { };
            app.data.buttons.one.callback = html => {
                const actorid = this.actor.id;
                const actorData = this.actor ? this.actor.data.data : {};
                const item = this.data;
                const itemid = item._id;
                let modifier = parseInt(html.find('[name=modifier]')[0].value);
                let stressMod = parseInt(html.find('[name=stressMod]')[0].value);
                const itemData = item.data;
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

                r2Data += stressMod;
        
                const skillBonus = actorData.skills[itemData.attributes.skill.value]?.mod - actorData.attributes[swSkills[itemData.attributes.skill.value]?.ability]?.value;
                const r1Data = actorData.attributes[itemData.attributes.attribute.value].mod + (skillBonus || 0) + itemData.attributes.bonus.value + modifier;
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

        });
    }

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

        const skillBonus = actorData.skills[itemData.attributes.skill.value]?.mod - actorData.attributes[swSkills[itemData.attributes.skill.value]?.ability]?.value;
        const r1Data = actorData.attributes[itemData.attributes.attribute.value].mod + (skillBonus || 0) + itemData.attributes.bonus.value;
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
