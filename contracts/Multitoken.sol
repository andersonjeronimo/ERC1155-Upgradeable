// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

/* import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Strings.sol"; */

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Multitoken is
    Initializable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    OwnableUpgradeable,
    ERC1155SupplyUpgradeable
{
    uint256 public constant NFT_1 = 0;
    uint256 public constant NFT_2 = 1;
    uint256 public constant NFT_3 = 2;

    //address payable public immutable _owner;
    //uint256[] public currentSupply = [50, 50, 50];
    uint256 public tokenPrice; // = 0.01 ether;
    uint256[] public maxSupply;
    string private _uri;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
        //_owner = payable(msg.sender);
    }

    /* function initialize(address initialOwner) initializer public {
        __ERC1155_init(_uri);
        __ERC1155Burnable_init();
        __Ownable_init(initialOwner);
        __ERC1155Supply_init();
        tokenPrice = 0.01 ether;
    } */

    function initialize() public initializer {
        __ERC1155_init(_uri);
        __ERC1155Burnable_init();
        __Ownable_init(msg.sender);
        __ERC1155Supply_init();
        tokenPrice = 0.01 ether;
        maxSupply = [50, 50, 50];
        _uri =  "https://yellow-wonderful-vulture-357.mypinata.cloud/ipfs/QmSYDgxC6wKJ9SqyDFZpy3mrc5ikc8P7kvTUDHHsFPaunB/";
    }

    function mint(uint256 _id, uint256 _amount) external payable {
        require(_id < 3, "This token _id does not exists");
        require(
            (maxSupply[_id] - totalSupply(_id)) >= _amount,
            "Amount greater than current supply"
        );
        require(msg.value >= tokenPrice * _amount, "Insufficient payment");
        _mint(msg.sender, _id, _amount, "0x00000000");
        emit TransferSingle(msg.sender, address(0), msg.sender, _id, _amount);
    }

    function uri(
        uint256 _id
    ) public view virtual override returns (string memory) {
        require(_id < 3, "This token _id does not exists");
        require(totalSupply(_id) > 0, "This token _id was not minted yet");
        return string.concat(_uri, Strings.toString(_id), ".json");
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        address payable recipient = payable(owner());
        (bool success, ) = recipient.call{value: amount}("");
        require(success == true, "Failed to withdraw");
    }

    // The following functions are overrides required by Solidity.
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }
}
