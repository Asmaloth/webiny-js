import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as DeleteIcon } from "~/admin/assets/delete.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData } from "~/types";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";

interface DeletePageProps {
    page: PbPageData;
    onDelete?: () => void;
}
const DeletePage = (props: DeletePageProps) => {
    const { page, onDelete } = props;
    const { canDelete } = usePagesPermissions();
    const { openDialogDeletePage } = useDeletePage({ page, onDelete });

    if (!canDelete(page?.createdBy?.id)) {
        return null;
    }

    return (
        <Tooltip content={"Delete Page"} placement={"top"}>
            <IconButton
                icon={<DeleteIcon />}
                onClick={openDialogDeletePage}
                data-testid={"pb-page-details-header-delete-button"}
            />
        </Tooltip>
    );
};

export default DeletePage;
