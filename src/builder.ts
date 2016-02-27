import {MyCreep} from "creep";
import {IMyCreep} from "creep";

export interface IBuilder extends IMyCreep {
    //buildOnNearestConstructionSite(spawn:Spawn): void;
    //upgradeController(spawn:Spawn): void;
    //maintainRoads(spawn:Spawn): void;
    //reinforce(energySource:Spawn|Link|Storage, structureType:string): boolean;
    runRoutine();
}

export class Builder extends MyCreep implements IBuilder {

    private wallMaxLife = 15000;
    private wallMaxLife = 15000;

    constructor(private creep:Creep, energySourceIds?:string[]) {
        super(creep, energySourceIds);
    }
    //------ Public Methods --------------------------------------------------------------------------------------------
    public runRoutine():number {
        if (this.creep.carry.energy === 0) {
            this.routine = [
                this.getEnergyFromSources
            ];
        }
        else {
            this.routine = [
                this.buildOnNearestConstructionSite,
                this.reinforceWalls,
                this.reinforceRamparts,
                //this.maintainRoads,
            ];
        }
        let actionResult = ERR_NOT_FOUND;
        let actionIndex = 0;
        while (!(actionResult === OK) && actionIndex < this.routine.length) {
            actionResult = this.routine[actionIndex].call(this);
            actionIndex++;
        }
        return actionResult;

    }

    //------ Private methods -------------------------------------------------------------------------------------------
    /**
     * building is different from the rest of the actions since it can be performed from several tiles away.
     * TODO: Find a better way to estimate the distance in order to avoid unnecessary build calls
     */
    protected buildOrMoveTo(buildTarget:ConstructionSite):number {
        let buildStatus = this.creep.build(buildTarget);
        if (buildStatus === ERR_NOT_IN_RANGE) {
            return this.creep.moveTo(buildTarget);
        }
        return buildStatus;
    }

    protected repairOrMoveTo(buildTarget:Structure):number {
        let buildStatus = this.creep.repair(buildTarget);
        if (buildStatus === ERR_NOT_IN_RANGE) {
            return this.creep.moveTo(buildTarget);
        }
        return buildStatus;
    }


    private buildOnNearestConstructionSite():number {
        let closestTarget = this.findClosestByRange<ConstructionSite>(FIND_CONSTRUCTION_SITES);
        if (closestTarget) {
            return this.buildOrMoveTo(closestTarget);
        }
        return ERR_NOT_FOUND;
    }

    private maintainRoads(spawn:Spawn):number {
        let closestRoad = <Road>this.findClosestByRange(FIND_STRUCTURES,
            (object:Structure) => (object.structureType === STRUCTURE_ROAD && (object.hits < object.hitsMax / 2)));

        if (closestRoad) {
            return this.doOrMoveTo(this.creep.repair, closestRoad);
        }
        return ERR_NOT_FOUND;
    }

    private reinforce(structureType:string):number {
        var target = this.findClosestByRange(FIND_STRUCTURES, (object) => {
            return object.structureType == structureType && object.hits < this.wallMaxLife;
        });
        if (target) {
            return this.repairOrMoveTo(target);
        }
        return ERR_NOT_FOUND;
    }

    private reinforceWalls():number {
        return this.reinforce(STRUCTURE_WALL);
    }

    private reinforceRamparts():number {
        return this.reinforce(STRUCTURE_RAMPART);
    }
}

export class ControllerUpgrader extends MyCreep {
    constructor(private creep:Creep, energySourceIds:string[]) {
        super(creep, energySourceIds);
    }

    private upgradeController():number {
        let target = this.creep.room.controller;
        if (target) {
            return this.doOrMoveTo(this.creep.upgradeController, target);
        }
        return ERR_NOT_FOUND;
    }

    public runRoutine() {
        if (this.creep.carry.energy === 0) {
            this.routine = [
                this.getEnergyFromSources
            ];
        }
        else {
            this.routine = [
                this.upgradeController
            ];
        }
        let actionResult = ERR_NOT_FOUND;
        let actionIndex = 0;
        while (!(actionResult === OK) && actionIndex < this.routine.length) {
            actionResult = this.routine[actionIndex].call(this);
            actionIndex++;
        }
        return actionResult;
    }
}