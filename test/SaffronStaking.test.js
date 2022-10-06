const hre = require("hardhat");
var chaiAsPromised = require("chai-as-promised");
const { assert } = require("chai").use(chaiAsPromised);
const { time } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const ERC20 = hre.artifacts.require("MockERC20");
const SaffronERC20Staking = hre.artifacts.require("SaffronERC20Staking");
const SFIRewarder = hre.artifacts.require("SFIRewarder");

const toWei = (amount, decimal = 18) => {
  return hre.ethers.utils.parseUnits(
    hre.ethers.BigNumber.from(amount).toString(),
    decimal
  );
};

describe("Saffron staking contract test", () => {
  let masterchef;
  let sfi, lpToken1, lpToken2;
  let rewardEndBlock;
  let sfiPerBlock = 1072052954000000;
  let alice, bob, craig, rewardDistributor;

  before("deploy contracts", async () => {
    [alice, bob, craig] = await web3.eth.getAccounts();

    sfi = await ERC20.new("Mock SFI", "SFI", toWei(10000000));

    lpToken1 = await ERC20.new("Mock LpToken1", "LP1", toWei(10000000), {
      from: bob
    });

    lpToken2 = await ERC20.new("Mock LpToken2", "LP2", toWei(10000000), {
      from: craig
    });

    rewardDistributor = await SFIRewarder.new(sfi.address);

    console.log("SFI Rewarder deployed at ", rewardDistributor.address);

    await sfi.transfer(rewardDistributor.address, toWei(10000), {
      from: alice
    });

    masterchef = await SaffronERC20Staking.new(
      sfi.address,
      rewardDistributor.address,
      sfiPerBlock
    );
    console.log("Masterchef deployed at ", masterchef.address);

    await rewardDistributor.setStakingAddress(masterchef.address, {
      from: alice
    });
  });

  it("add pool should work", async () => {
    await masterchef.add(100, sfi.address, false);
    await masterchef.add(100, lpToken1.address, false);
    await masterchef.add(100, lpToken2.address, false);

    const poolLength = await masterchef.poolLength();
    assert(poolLength.toString() === "3", "add pool error");
  });

  it("set rewardendblock should work", async () => {
    await masterchef.setRewardEndBlock(90947); //around 2 weeks after
    const endBlock = await masterchef.rewardEndBlock();
    console.log("reward end block => ", endBlock.toString());
  });

  it("deposit should work", async () => {
    console.log("========= Alice SFI Deposit =========");
    await sfi.approve(masterchef.address, toWei(10000), { from: alice });
    await masterchef.deposit(0, toWei(10000), { from: alice });

    console.log("========= Bob Lp token1 Deposit =========");
    await lpToken1.approve(masterchef.address, toWei(20000), { from: bob });
    await masterchef.deposit(1, toWei(20000), { from: bob });

    console.log("========= Craig lp token2 Deposit =========");
    await lpToken2.approve(masterchef.address, toWei(30000), { from: craig });
    await masterchef.deposit(2, toWei(30000), { from: craig });

    await advanceBlock(90947); // around 15 days after

    let pendingSFI = await masterchef.pendingSFI(0, alice);
    console.log("Alice's pending SFI => ", pendingSFI.toString());

    pendingSFI = await masterchef.pendingSFI(1, bob);
    console.log("Bob's pending SFI => ", pendingSFI.toString());

    pendingSFI = await masterchef.pendingSFI(2, craig);
    console.log("Craig's pending SFI => ", pendingSFI.toString());
  });

  it("claim reward should work", async () => {
    await masterchef.withdraw(0, 0, { from: alice });
    console.log(
      "Alice's SFI balance => ",
      (await sfi.balanceOf(alice)).toString()
    );

    await masterchef.withdraw(1, 0, { from: bob });

    console.log("Bob's SFI balance => ", (await sfi.balanceOf(bob)).toString());

    await masterchef.withdraw(2, 0, { from: craig });

    console.log(
      "Craig's SFI balance => ",
      (await sfi.balanceOf(craig)).toString()
    );
  });

  it("make sure rewardendBlock is working, pending SFI should be zero", async () => {
    await advanceBlock(10000); // around 15 days after
    let pendingSFI = await masterchef.pendingSFI(0, alice);
    console.log("Alice's pending SFI => ", pendingSFI.toString());

    pendingSFI = await masterchef.pendingSFI(1, bob);
    console.log("Bob's pending SFI => ", pendingSFI.toString());

    pendingSFI = await masterchef.pendingSFI(2, craig);
    console.log("Craig's pending SFI => ", pendingSFI.toString());
  });

  it("withdraw should work", async () => {
    await masterchef.withdraw(0, toWei(10000), {
      from: alice
    });
    console.log(
      "Alice's SFI balance => ",
      (await sfi.balanceOf(alice)).toString()
    );

    await masterchef.withdraw(1, toWei(20000), {
      from: bob
    });
    console.log(
      "Bob's Lp Token1 balance => ",
      (await lpToken1.balanceOf(bob)).toString()
    );
    console.log("Bob's SFI balance => ", (await sfi.balanceOf(bob)).toString());

    await masterchef.withdraw(2, toWei(30000), {
      from: craig
    });
    console.log(
      "Craig's Lp Token2 balance => ",
      (await lpToken2.balanceOf(craig)).toString()
    );
    console.log(
      "Craig's SFI balance => ",
      (await sfi.balanceOf(craig)).toString()
    );
  });

  const advanceBlock = async count => {
    console.log(`advancing chain ${count} blocks`);
    for (let i = 1; i <= count; i++) {
      await hre.network.provider.send("evm_mine");
      if (i % 10000 === 0) {
        console.log("+10000 blocks");
      }
    }
  };
});
