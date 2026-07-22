import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GameAccessModule = buildModule("GameAccessModule", (m) => {
  const gameAccess = m.contract("GameAccess", []);

  return { gameAccess };
});

export default GameAccessModule;
