async function main() {
  // const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  // const MockERC20 = await MockERC20Factory.deploy(
  //   "TEST SFI",
  //   "SFI",
  //   "10000000000000000000000000"
  // );
  // console.log("MockERC20 deployed to:", MockERC20.address);

  const SFI = "0xb753428af26E81097e7fD17f40c88aaA3E04902c";

  const SFIRewarder = await ethers.getContractFactory("SFIRewarder");

  const sfiRewarder = await SFIRewarder.deploy(SFI);

  console.log("SFIRewarder deployed to:", sfiRewarder.address);

  await sfiRewarder.deployed();

  const SaffronERC20Staking = await ethers.getContractFactory(
    "SaffronERC20Staking"
  );

  /*
  const totalSFI = "97500000000000000000";
  const avgBlockTime = "13.20";
  const blockper2week = "91636.3636363636"; //60*60*24*14 / avgBlockTime
  */

  const sfiPerBlock = "1063988095238095"; // totalSFI / sfiPerBlock

  const saffronStaking = await SaffronERC20Staking.deploy(
    SFI,
    sfiRewarder.address,
    sfiPerBlock
  );

  console.log("SaffronERC20Staking deployed to:", saffronStaking.address);
  await saffronStaking.deployed();
  ///////////////////////////////////////////////////////
  const SFI_ETH_LP = "0xC76225124F3CaAb07f609b1D147a31de43926cd6";
  const SFI_BTSE_LP = "0xffF475E8FDe7380A9A29a6441B832353337B094e";
  const SFI_GEEQ_LP = "0x5956F0d942b005cb5E6b1c77ef130239720AE1DA";
  const SFI_ESD_LP = "0x66f473b96F0AE6E1CaFe0113c1353BA43E381eda";
  const SFI_ETH_SUSHI_LP = "0x23a9292830Fc80dB7f563eDb28D2fe6fB47f8624";
  const ibeth_alpha_lp = "0x411A9B902F364817a0f9C4261Ce28b5566a42875";
  const sfi_prt_lp = "0x80E43f7DC09bCD2bF8723a74767d183b4F1c990f";

  await saffronStaking.add(2250, SFI, false);
  await saffronStaking.add(3375, SFI_ETH_LP, false);
  await saffronStaking.add(150, SFI_BTSE_LP, false);
  await saffronStaking.add(150, SFI_GEEQ_LP, false);
  await saffronStaking.add(150, SFI_ESD_LP, false);
  await saffronStaking.add(3375, SFI_ETH_SUSHI_LP, false);
  await saffronStaking.add(150, ibeth_alpha_lp, false);
  await saffronStaking.add(150, sfi_prt_lp, false);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
