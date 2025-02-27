import { registry } from "~/registry";
import { APIGatewayEvent } from "aws-lambda";
import { createSourceHandler } from "~/sourceHandler";
import { createHandler, HandlerParams } from "./index";

const handler = createSourceHandler<APIGatewayEvent, HandlerParams>({
    name: "handler-aws-api-gateway",
    canUse: event => {
        return !!event.httpMethod;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
