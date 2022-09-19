import { Component } from "the-world-engine";

export function unsafeIsComponent<T extends Component = Component>(value: any): value is T {
    return value instanceof Component;
}
