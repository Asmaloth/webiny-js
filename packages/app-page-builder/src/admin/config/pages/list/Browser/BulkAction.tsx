import React, { useCallback, useEffect, useRef } from "react";
import { CallbackParams, useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";
import { PbPageDataItem } from "~/types";

export interface BulkActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface BulkActionProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
    element: React.ReactElement;
}

export const BaseBulkAction: React.FC<BulkActionProps> = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    element
}) => {
    const getId = useIdGenerator("bulkAction");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="browser" name={"browser"}>
            <Property
                id={getId(name)}
                name={"bulkActions"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
            </Property>
        </Property>
    );
};

const useWorker = () => {
    const { selected, setSelected } = usePagesList();
    const { current: worker } = useRef(new Worker<PbPageDataItem>());

    useEffect(() => {
        worker.items = selected;
    }, [selected]);

    // Reset selected items in both usePagesList and Worker
    const resetItems = useCallback(() => {
        worker.items = [];
        setSelected([]);
    }, []);

    return {
        items: worker.items,
        process: (callback: (items: PbPageDataItem[]) => void) => worker.process(callback),
        processInSeries: async (
            callback: ({ item, allItems, report }: CallbackParams<PbPageDataItem>) => Promise<void>,
            chunkSize?: number
        ) => worker.processInSeries(callback, chunkSize),
        resetItems: resetItems,
        results: worker.results
    };
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});