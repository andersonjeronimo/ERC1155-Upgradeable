import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultitokenModule", (m) => {
  //const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);
  const multitoken = m.contract("Multitoken");
  return { multitoken };
});