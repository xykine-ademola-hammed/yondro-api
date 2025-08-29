"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionSeeder = void 0;
const Position_1 = require("../models/Position");
class PositionSeeder {
    static async run() {
        await Position_1.Position.bulkCreate([
            {
                organizationId: 1,
                departmentId: 1,
                title: "Yondro Admin",
            },
        ], { ignoreDuplicates: true });
    }
}
exports.PositionSeeder = PositionSeeder;
//# sourceMappingURL=PositionSeeder.js.map