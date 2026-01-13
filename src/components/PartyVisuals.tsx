import * as React from "react";
import { Character } from "../types";

interface PartyVisualsProps {
    party: { [key: string]: Character };
}

export const PartyVisuals = ({ party }: PartyVisualsProps) => {
    const characters = [party.hero, party.playboy, party.scholar, party.hunter];

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '32px', height: '120px' }}>
            {characters.map((char) => (
                <div key={char.id} style={{ textAlign: 'center' }}>
                    <img 
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${char.imageSeed}`} 
                        width="64" 
                        alt={char.name}
                        style={{ 
                            imageRendering: 'pixelated', 
                            filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.5))' 
                        }}
                    />
                </div>
            ))}
        </div>
    );
};