// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @dev SFI Rewarder contract to give the rewards to users instead of minting SFI
contract SFIRewarder is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public sfi;
    address public saffronStaking;

    constructor(address _sfi) public {
        require(_sfi != address(0), "invalid sfi address");
        sfi = IERC20(_sfi);
    }

    /// @dev set the saffron staking address
    function setStakingAddress(address _staking) external onlyOwner {
        require(_staking != address(0), "invalid staking addr");
        saffronStaking = _staking;
    }

    event SupplyReward(address indexed to, uint256 amount, uint256 timestamp);

    /// @dev send the SFI rewards to users
    function supplyRewards(address to, uint256 amount) external returns (uint256) {
        require(saffronStaking != address(0), "staking addr is not set");
        require(msg.sender == saffronStaking, "only staking pool can call this func");

        uint256 _balance = sfi.balanceOf(address(this));
        amount = _balance > amount ? amount : _balance;
        if (amount > 0) {
            sfi.safeTransfer(to, amount);
            emit SupplyReward(to, amount, block.timestamp);
        }
        return amount;
    }

    /// @dev emergency withdraw tokens(SFI) in case of bugs
    function emergencyWithdraw(address token, address to) external onlyOwner {
        uint256 _balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, _balance);
    }
}
