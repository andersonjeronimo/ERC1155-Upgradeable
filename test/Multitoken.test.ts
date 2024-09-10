import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers, upgrades } from "hardhat";
import { Multitoken } from "../typechain-types";

describe("Multitoken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const Multitoken = await hre.ethers.getContractFactory("Multitoken");
    const contract = await upgrades.deployProxy(Multitoken);//Multitoken.deploy();    
    const contractAddress = await contract.getAddress();
    return { contract, contractAddress, owner, otherAccount };
  }

  it("Should mint", async function () {
    const { contract, owner } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    const balance = await contract.balanceOf(owner.address, 0);
    expect(balance).to.be.equal(1, "Cannot mint");
    
  });

  it("Should mint (multiple tokens)", async function () {
    const { contract, owner } = await loadFixture(deployFixture);
    await contract.mint(0, 3, { value: hre.ethers.parseEther("0.03") });
    const balance = await contract.balanceOf(owner.address, 0);
    expect(balance).to.be.equal(3, "Cannot mint");    
  });

  it("Should NOT mint (insufficient payment)", async function () {
    const { contract } = await loadFixture(deployFixture);
    //mint 2 tokens passing 1 token value (0.01 ether)
    await expect(contract.mint(0, 2, { value: hre.ethers.parseEther("0.01") }))
      .to.be.revertedWith("Insufficient payment");
  });

  it("Should NOT mint (token ID does not exists)", async function () {
    const { contract } = await loadFixture(deployFixture);
    await expect(contract.mint(4, 1, { value: hre.ethers.parseEther("0.01") }))
      .to.be.revertedWith("This token _id does not exists");
  });

  it("Should NOT mint (amount > current supply)", async function () {
    const { contract } = await loadFixture(deployFixture);
    await expect(contract.mint(0, 51, { value: hre.ethers.parseEther("0.01") }))
      .to.be.revertedWith("Amount greater than current supply");
  });

  it("Should burn", async function () {
    const { contract, owner } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await contract.burn(owner.address, 0, 1);
    const balance = await contract.balanceOf(owner.address, 0);
    expect(balance).to.be.equal(0, "Cannot burn");
  });

  it("Should burn (approved)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await contract.setApprovalForAll(otherAccount.address, true);
    const approved = await contract.isApprovedForAll(owner.address, otherAccount.address);
    const instance = contract.connect(otherAccount) as Multitoken;
    await instance.burn(owner.address, 0, 1);
    const balance = await contract.balanceOf(owner.address, 0);
    expect(approved).to.be.equal(true, "Cannot delegate burn");
    expect(balance).to.be.equal(0, "Cannot delegate burn");
  });

  it("Should NOT burn (balance)", async function () {
    const { contract, owner } = await loadFixture(deployFixture);
    //await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await expect(contract.burn(owner.address, 0, 1))
      .to.be.revertedWithCustomError(contract, "ERC1155InsufficientBalance");
  });

  it("Should NOT burn (permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    const approved = await contract.isApprovedForAll(owner.address, otherAccount.address);
    const instance = contract.connect(otherAccount) as Multitoken;
    expect(approved).to.be.equal(false, "Approved without set by owner");
    await expect(instance.burn(owner.address, 0, 1))
      .to.be.revertedWithCustomError(contract, "ERC1155MissingApprovalForAll");
  });

  it("Should safe transfer from", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await contract.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000");
    const balances = await contract.balanceOfBatch([owner.address, otherAccount.address], [0, 0]);    
    expect(balances[0]).to.be.equal(0, "Cannot safe transfer");
    expect(balances[1]).to.be.equal(1, "Cannot safe transfer");    
  });

  it("Should emit transfer event", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await expect(contract.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000"))
      .to.emit(contract, "TransferSingle").withArgs(owner.address, owner.address, otherAccount.address, 0, 1);
  });

  it("Should emit approval for all event", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await expect(contract.setApprovalForAll(otherAccount.address, true))
      .to.emit(contract, "ApprovalForAll").withArgs(owner.address, otherAccount.address, true);
  });

  it("Should NOT safe transfer from (balance)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    //await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await expect(contract.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000"))
      .to.be.revertedWithCustomError(contract, "ERC1155InsufficientBalance");
  });

  it("Should NOT safe transfer from (permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    const instance = contract.connect(otherAccount) as Multitoken;
    await expect(instance.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000"))
      .to.be.revertedWithCustomError(contract, "ERC1155MissingApprovalForAll");
  });

  it("Should NOT safe batch transfer from (array mismatch)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await contract.mint(1, 1, { value: hre.ethers.parseEther("0.01") });
    await expect(contract.safeBatchTransferFrom(owner.address, otherAccount.address, [0, 1], [1], "0x00000000"))
      .to.be.revertedWithCustomError(contract, "ERC1155InvalidArrayLength");
  });

  it("Should NOT safe batch transfer from (permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await contract.mint(1, 1, { value: hre.ethers.parseEther("0.01") });
    const instance = contract.connect(otherAccount) as Multitoken;
    await expect(instance.safeBatchTransferFrom(owner.address, otherAccount.address, [0, 1], [1, 1], "0x00000000"))
      .to.be.revertedWithCustomError(contract, "ERC1155MissingApprovalForAll");
  });

  //https://eips.ethereum.org/EIPS/eip-1155
  it("Should supports interface", async function () {
    const { contract } = await loadFixture(deployFixture);
    const supports = await contract.supportsInterface("0xd9b67a26");
    expect(supports).to.be.equal(true, "Does not supports interface ERC-1155");
  });

  it("Should withdraw", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    const instance = contract.connect(otherAccount) as Multitoken;
    await instance.mint(0, 3, { value: hre.ethers.parseEther("0.03") });

    const contractBalanceBefore = await hre.ethers.provider.getBalance(contract.getAddress());
    const ownerBalanceBefore = await hre.ethers.provider.getBalance(owner.address);

    await contract.withdraw();

    const contractBalanceAfter = await hre.ethers.provider.getBalance(contract.getAddress());
    const ownerBalanceAfter = await hre.ethers.provider.getBalance(owner.address);

    expect(contractBalanceBefore).to.be.equal(hre.ethers.parseEther("0.03"), "Cannot withdraw");
    expect(contractBalanceAfter).to.be.equal(0, "Cannot withdraw");

    expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore, "Cannot withdraw");
  });

  it("Should NOT withdraw (permission)", async function () {
    const { contract, otherAccount } = await loadFixture(deployFixture);
    const instance = contract.connect(otherAccount) as Multitoken;
    await expect(instance.withdraw()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("Should has URI metadata", async function () {
    const { contract } = await loadFixture(deployFixture);
    await contract.mint(0, 3, { value: hre.ethers.parseEther("0.03") });
    const uri = await contract.uri(0);
    expect(uri).to.be.equal("https://yellow-wonderful-vulture-357.mypinata.cloud/ipfs/QmSYDgxC6wKJ9SqyDFZpy3mrc5ikc8P7kvTUDHHsFPaunB/0.json");
  });

  it("Should NOT has URI metadata (token _id does not exists)", async function () {
    const { contract } = await loadFixture(deployFixture);
    await contract.mint(0, 3, { value: hre.ethers.parseEther("0.03") });
    await expect(contract.uri(4)).to.be.revertedWith("This token _id does not exists");
  });

  it("Should NOT has URI metadata (token _id was not minted yet)", async function () {
    const { contract } = await loadFixture(deployFixture);
    await contract.mint(0, 1, { value: hre.ethers.parseEther("0.01") });
    await expect(contract.uri(1)).to.be.revertedWith("This token _id was not minted yet");
  });


});