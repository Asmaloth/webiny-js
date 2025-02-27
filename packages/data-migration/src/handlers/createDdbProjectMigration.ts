import { Table } from "@webiny/db-dynamodb/toolbox";
import { createRawEventHandler } from "@webiny/handler-aws";
import { Constructor, createContainer } from "@webiny/ioc";
import { IsMigrationApplicable, MigrationRunner } from "~/MigrationRunner";
import {
    ExecutionTimeLimiterSymbol,
    MigrationRepositorySymbol,
    MigrationSymbol,
    PrimaryDynamoTableSymbol
} from "~/symbols";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";
import { devVersionErrorResponse } from "./devVersionErrorResponse";
import { createPatternMatcher } from "./createPatternMatcher";
import {
    DataMigration,
    ExecutionTimeLimiter,
    MigrationEventHandlerResponse,
    MigrationEventPayload,
    MigrationRepository
} from "~/types";
import { coerce as semverCoerce } from "semver";

interface CreateDdbDataMigrationConfig {
    migrations: Constructor<DataMigration>[];
    primaryTable: Table<string, string, string>;
    repository?: MigrationRepository;
    isMigrationApplicable?: IsMigrationApplicable;
    timeLimiter?: ExecutionTimeLimiter;
}

export const createDdbProjectMigration = ({
    migrations,
    primaryTable,
    isMigrationApplicable = undefined,
    repository = undefined,
    ...config
}: CreateDdbDataMigrationConfig) => {
    return createRawEventHandler<MigrationEventPayload, any, MigrationEventHandlerResponse>(
        async ({ payload, lambdaContext }) => {
            const projectVersion = String(payload?.version || process.env.WEBINY_VERSION);

            const version = semverCoerce(projectVersion);
            if (version?.version === "0.0.0") {
                return devVersionErrorResponse();
            }

            // COMPOSITION ROOT
            const container = createContainer();
            container.bind(PrimaryDynamoTableSymbol).toConstantValue(primaryTable);

            const timeLimiter: ExecutionTimeLimiter =
                config.timeLimiter || lambdaContext?.getRemainingTimeInMillis || (() => 0);
            container.bind(ExecutionTimeLimiterSymbol).toConstantValue(timeLimiter);

            if (repository) {
                // Repository implementation provided by the user.
                container.bind(MigrationRepositorySymbol).toConstantValue(repository);
            } else {
                // Default repository implementation.
                container.bind(MigrationRepositorySymbol).to(MigrationRepositoryImpl);
            }

            // Bind the provided migrations.
            migrations.forEach(migration => container.bind(MigrationSymbol).to(migration));

            // If handler was invoked with a `pattern`, filter migrations that match the pattern only.
            let patternMatcher;
            if (payload.pattern) {
                patternMatcher = createPatternMatcher(payload.pattern);
            }

            // Inject dependencies and execute.
            try {
                const runner = await container.resolve(MigrationRunner);
                runner.setContext({
                    logGroupName: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
                    logStreamName: process.env.AWS_LAMBDA_LOG_STREAM_NAME
                });

                if (payload.command === "execute") {
                    await runner.execute(projectVersion, patternMatcher || isMigrationApplicable);
                    return;
                }

                return {
                    data: await runner.getStatus()
                };
            } catch (err) {
                return { error: { message: err.message } };
            }
        }
    );
};
