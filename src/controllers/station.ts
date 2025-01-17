import { Elysia, InternalServerError, t } from "elysia"
import * as service from "../services"
import {
  SyncType,
  scheduleResponseObject,
  syncResponse,
} from "../commons/types"

const stationController = (app: Elysia) =>
  app.group("/station", (app) => {
    app.post(
      "/",
      async (ctx) => {
        const type: SyncType = ctx.query.from_cron ? "cron" : "manual"

        if (process.env.NODE_ENV === "development")
          return await service.station.sync(type)

        const token = ctx.headers.authorization

        if (!token) throw new InternalServerError("Please provide a token")

        if (token.split(" ")[1] !== process.env.SYNC_TOKEN)
          throw new InternalServerError("Invalid token")

        return await service.station.sync(type)
      },
      {
        headers:
          process.env.NODE_ENV === "development"
            ? undefined
            : t.Object({
                authorization: t.Nullable(t.String()),
              }),
        query: t.Object({
          from_cron: t.Optional(t.BooleanString()),
        }),
        detail: {
          description: "Sync station data",
        },
        response: syncResponse("station"),
      }
    )

    app.get(
      "/",
      async (ctx) => {
        return await service.station.getAll()
      },
      {
        response: {
          404: t.Object(
            {
              status: t.Number(),
              message: t.String(),
            },
            {
              default: {
                status: 404,
                message: "Station data is not found",
              },
            }
          ),
          200: t.Object(
            {
              status: t.Number(),
              data: t.Array(t.Object(scheduleResponseObject)),
            },
            {
              default: {
                status: 200,
                data: [
                  {
                    id: "AC",
                    name: "ANCOL",
                    daop: 1,
                    fgEnable: 1,
                    haveSchedule: true,
                    updatedAt: "2024-03-10T09:55:07.213Z",
                  },
                  {
                    id: "AK",
                    name: "ANGKE",
                    daop: 1,
                    fgEnable: 1,
                    haveSchedule: true,
                    updatedAt: "2024-03-10T09:55:07.213Z",
                  },
                ],
              },
            }
          ),
        },
        detail: {
          description: "Get a list of station data",
        },
      }
    )

    app.get(
      "/:id",
      async (ctx) => {
        if (!ctx.params.id)
          throw new InternalServerError("Station ID is required")

        return await service.station.getById(ctx.params.id)
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          404: t.Object(
            {
              status: t.Number(),
              message: t.String(),
            },
            {
              default: {
                status: 404,
                message: "Station data is not found",
              },
            }
          ),
          200: t.Object(
            {
              status: t.Number(),
              data: t.Object(scheduleResponseObject),
            },
            {
              default: {
                status: 200,
                data: {
                  id: "AC",
                  name: "ANCOL",
                  daop: 1,
                  fgEnable: 1,
                  haveSchedule: true,
                  updatedAt: "2024-03-10T09:55:07.213Z",
                },
              },
            }
          ),
        },
        detail: {
          description: "Get a station data from a station ID",
        },
      }
    )

    return app
  })

export default stationController
