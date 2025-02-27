import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";

const { Record } = AcoConfig;

export { RecordActionConfig as EntryActionConfig };

export interface EntryActionProps extends React.ComponentProps<typeof AcoConfig.Record.Action> {
    modelIds?: string[];
}

export const EntryAction = ({ modelIds = [], ...props }: EntryActionProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <CompositionScope name={"cms"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
