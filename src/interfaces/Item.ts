import {ItemType} from "../enums/ItemType"

export interface Item {
    id: number;
    name: string;
    description: string;
    type: ItemType;
}