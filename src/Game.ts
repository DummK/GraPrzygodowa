//importy enum I interface
import {Player} from "./interfaces/Player";
import {Locations} from "./enums/Locations";
import {Item} from "./interfaces/Item";
import {Scene} from "./interfaces/Scene";
import {Ending} from "./interfaces/Ending";
import {PlayerChoice} from "./interfaces/PlayerChoice";

//importy json
import * as Items from "./gameData/availableItems.json"
import * as Endings from "./gameData/availableEndings.json"
import * as Choices from "./gameData/availableChoices.json"
import * as Scenes from "./gameData/availableScenes.json"
import {ItemType} from "./enums/ItemType";
import {PlayerState} from "./enums/PlayerState";

//Stałe tablice dostępnych danych dla gry
const ITEMS: Item[] = new Array<Item>();
const ENDINGS: Ending[] = new Array<Ending>();
const CHOICES: PlayerChoice[] = new Array<PlayerChoice>();
const SCENES: Scene[] = new Array<Scene>();

for (const itemJSON of Items) {
    const tempObj: Item = {
        id: itemJSON.id,
        name: itemJSON.name,
        description: itemJSON.description,
        type: itemJSON.type as ItemType,

    }

    ITEMS.push(tempObj);
}
for (const endingJSON of Endings) {
    const tempObj: Ending = {
        id: endingJSON.id,
        title: endingJSON.title,
        description: endingJSON.description,
        requiredState: endingJSON.requiredState as PlayerState[] ?? undefined,
        requiredItems: endingJSON.requiredItems as ItemType[] ?? undefined,
    }

    ENDINGS.push(tempObj);
}
for (const choiceJSON of Choices) {
    const tempObj: PlayerChoice = {
        id: choiceJSON.id,
        description: choiceJSON.description,
        nextSceneId: choiceJSON.nextSceneId ?? undefined,
        stateEffect: choiceJSON.stateEffect as PlayerState ?? undefined,
        itemReward: choiceJSON.itemReward as ItemType ?? undefined,
        requiredState: choiceJSON.requiredState
    }

    ENDINGS.push(tempObj);
}

class Game {
    constructor(

    ) {

    }
}