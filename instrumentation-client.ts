import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    {
      path: "/api/simulate",
      method: "POST",
      advancedOptions: {
        checkLevel: "basic",
      },
    },
  ],
});
