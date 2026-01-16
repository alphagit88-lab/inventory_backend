import { AppDataSource } from "../config/data-source";
import { Branch } from "../entities/Branch";

export class BranchService {
  private branchRepository = AppDataSource.getRepository(Branch);

  async createBranch(
    tenantId: string,
    name: string,
    address?: string,
    phone?: string
  ) {
    const branch = this.branchRepository.create({
      tenant: { id: tenantId },
      name,
      address,
      phone,
    });

    return await this.branchRepository.save(branch);
  }

  async getBranchesByTenant(tenantId: string) {
    return await this.branchRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ["tenant"],
    });
  }

  async getBranchById(id: string) {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ["tenant", "users", "inventory"],
    });

    if (!branch) {
      throw new Error("Branch not found");
    }

    return branch;
  }

  async updateBranch(
    id: string,
    data: { name?: string; address?: string; phone?: string }
  ) {
    const branch = await this.getBranchById(id);

    if (data.name) branch.name = data.name;
    if (data.address) branch.address = data.address;
    if (data.phone) branch.phone = data.phone;

    return await this.branchRepository.save(branch);
  }

  async deleteBranch(id: string) {
    const branch = await this.getBranchById(id);
    return await this.branchRepository.remove(branch);
  }
}
