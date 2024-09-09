// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Multitoken is ERC1155, ERC1155Burnable {
    uint256 public constant NFT_1 = 0;
    uint256 public constant NFT_2 = 1;
    uint256 public constant NFT_3 = 2;

    address payable public immutable _owner;

    string private _uri = "https://yellow-wonderful-vulture-357.mypinata.cloud/ipfs/QmSYDgxC6wKJ9SqyDFZpy3mrc5ikc8P7kvTUDHHsFPaunB/";

    uint256[] public currentSupply = [50, 50, 50];
    uint256 public tokenPrice = 0.01 ether;    

    constructor() ERC1155(_uri) {
        _owner = payable(msg.sender);
    }

    function mint(
        uint256 _id,
        uint256 _amount
    ) external payable {
        require(_id < 3, "This token _id does not exists");
        require(currentSupply[_id] >= _amount, "Amount greater than current supply");        
        require(msg.value >= tokenPrice * _amount, "Insufficient payment");
        _mint(msg.sender, _id, _amount, "0x00000000");
        currentSupply[_id] -= _amount;
        emit TransferSingle(msg.sender, address(0), msg.sender, _id, _amount);
    }

    function uri(
        uint256 _id
    ) public view virtual override returns (string memory) {
        require(_id < 3, "This token _id does not exists");
        require(currentSupply[_id] < 50, "This token _id was not minted yet");
        return string.concat(_uri, Strings.toString(_id), ".json");
    }

    function withdraw() external {
        require(msg.sender == _owner, "You do not have permission");
        uint256 amount = address(this).balance;
        (bool success, ) = _owner.call{value: amount}("");
        require(success == true, "Failed to withdraw");
    }
}