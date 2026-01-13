import * as React from "react";
import { Character } from "../types";

interface StatusWindowProps {
    party: { [key: string]: Character };
}

export const StatusWindow = ({ party }: StatusWindowProps) => {
    const { hero, scholar, hunter, playboy } = party;
    const totalLevel = hero.level + scholar.level + hunter.level + playboy.level;

    return (
        <div>
            <StatusRow label="NAME" value="自分" />
            <StatusRow label="LV" value={totalLevel} />
            <StatusRow label="HP" value={999} />
            <StatusRow label="MP" value={450} />
            
            <hr style={{ borderColor: '#666', margin: '10px 0' }}/>
            
            <div style={{ fontSize: '0.9em', color: '#ccc'}}>
                <SmallStatus char={hero} />
                <SmallStatus char={playboy} />
                <SmallStatus char={scholar} />
                <SmallStatus char={hunter} />
            </div>
        </div>
    );
};

const StatusRow = ({ label, value }: { label: string, value: string | number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#ffcc00' }}>{label}</span>
        <span>{value}</span>
    </div>
);

const SmallStatus = ({ char }: { char: Character }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{char.name}</span>
        <span>Lv.{char.level}</span>
    </div>
);