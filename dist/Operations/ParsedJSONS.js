"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endings = exports.items = exports.playerChoices = exports.scenes = void 0;
//GAME DATA
const availableScenes_json_1 = __importDefault(require("../gameData/availableScenes.json"));
const availableChoices_json_1 = __importDefault(require("../gameData/availableChoices.json"));
const availableItems_json_1 = __importDefault(require("../gameData/availableItems.json"));
const availableEndings_json_1 = __importDefault(require("../gameData/availableEndings.json"));
function parseDataFromJSON(data) {
    try {
        return data;
    }
    catch (e) {
        console.error(e);
        return [];
    }
}
exports.scenes = parseDataFromJSON(availableScenes_json_1.default);
exports.playerChoices = parseDataFromJSON(availableChoices_json_1.default);
exports.items = parseDataFromJSON(availableItems_json_1.default);
exports.endings = parseDataFromJSON(availableEndings_json_1.default);
