import * as React from "react";
import { type BehaviorSubject, type Observable } from "../engine/reactive";

export interface Types {
    number: number
    string: string
}
export interface Port<K extends keyof Types> {
    id: string;
    type: K;
    linkedTo: BehaviorSubject<SomeNodeData<K> | null>
}

export type SomePort<Dom extends keyof Types = keyof Types> = <R>(c: <K extends Dom>(node: Port<K>) => R) => R


export type MapTypes<A extends (keyof Types)[]> = {
    [X in keyof A]: Types[A[X]]
}

export type MapTypeObservable<A extends (keyof Types)[]> = {
    [X in keyof A]: Observable<Types[A[X]]>
}


export type MapPort<A extends (keyof Types)[]> = {
    [X in keyof A]: SomePort<A[X]>
}

export interface AbstractNodeData<out Out extends keyof Types> {
    id: string;
    label: string;
    position: BehaviorSubject<{ x: number; y: number }>;
    result: Observable<Types[Out]>;
    width$: BehaviorSubject<number>;
}

export interface NodeData<In extends (keyof Types)[], Out extends keyof Types> extends AbstractNodeData<Out> {
    _next: BehaviorSubject<Observable<Types[Out]>>;
    next: Observable<Types[Out]>;
    config: NodeConfig<In, Out>;
    inputs: MapPort<In>;
}

export interface NodeConfig<In extends (keyof Types)[], Out extends keyof Types> {
    operator: (...x: MapTypeObservable<In>) => Observable<Types[Out]>;
    inputTypes: In;
    type: Out;
    Component?: (props: {node: NodeData<In, Out>}) => React.ReactNode
}

export type SomeNodeData<K extends keyof Types = keyof Types> = <R>(c: <In extends (keyof Types)[], Out extends K>(node: NodeData<In, Out>) => R) => R
export type SomeNodeConfig = <R>(c: <In extends (keyof Types)[], Out extends keyof Types>(node: NodeConfig<In, Out>) => R) => R

